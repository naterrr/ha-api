#!/usr/bin/env bash

# http://stackoverflow.com/questions/7739645/install-mysql-on-ubuntu-without-password-prompt
export DEBIAN_FRONTEND=noninteractive


apt-get update


# git + etckeeper
apt-get install -y git etckeeper

git config --global user.name "Automatic Jack"
git config --global user.email webmaster@hyperaud.io

cd /etc/etckeeper
ln -sf /vagrant/etc/etckeeper.conf
etckeeper init
etckeeper commit -m"init"

# essentials
apt-get install -y tree vim


# JVM
# apt-get install -y openjdk-7-jdk

# + jgit!


apt-get -y upgrade


# mongo
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' > /etc/apt/sources.list.d/mongodb.list

# install add-apt-repository
apt-get install -y python-software-properties

# mosh
add-apt-repository -y ppa:keithw/mosh

# ffmpeg http://linuxg.net/how-to-install-ffmpeg-2-1-ubuntu-13-10-13-04-12-10-linux-mint-16-15-14-and-pear-os-8-7/
add-apt-repository -y ppa:samrog131/ppa


apt-get update


# mosh
apt-get install -y mosh

# mongodb
apt-get install -y mongodb-10gen

# ffmpeg
apt-get install -y ffmpeg
# TODO from source https://trac.ffmpeg.org/wiki/UbuntuCompilationGuide incl x264

apt-get install -y rtmpdump librtmp-dev
apt-get install -y youtube-dl
apt-get install -y libmp3lame-dev
apt-get install -y libavcodec-extra-53
apt-get install -y libmp3lame0 libmp3lame-dev libx264-120 libx264-dev sox libavcodec53 libavcodec-dev
apt-get install -y libavcodec-extra-53 libavdevice-extra-53 libavfilter-extra-2 libavformat-extra-53 libavutil-extra-51 libpostproc-extra-52 libswscale-extra-2
# apt-get install -y ubuntu-restricted-extras


# node from source
# https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager
apt-get install -y g++ make build-essential
cd /opt
wget http://nodejs.org/dist/v0.10.24/node-v0.10.24.tar.gz
tar -xzf node-v0.10.24.tar.gz
cd node-v0.10.24
./configure
make
make install

# FIXME make this non-interactive
# https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager
# apt-get install python g++ make checkinstall
# cd /opt
# mkdir node-latest && cd $_
# wget -N http://nodejs.org/dist/node-latest.tar.gz
# tar xzvf node-latest.tar.gz && cd node-v* #(remove the "v" in front of the version number in the dialog)
# ./configure
# checkinstall
# dpkg -i node_*

npm update -g

# essential
npm install -g pm2

# local dev essentials
npm install -g bower
npm install -g grunt-cli
npm install -g yo

# compass style
apt-get install -y ruby1.9.1
# gem update --system
gem install compass



# beanstalkd
apt-get install -y beanstalkd
cd /etc/default/
ln -sf /vagrant/etc/default/beanstalkd
service beanstalkd start

# apache + LAMP
apt-get install -y apache2 apache2-threaded-dev lamp-server^
apt-get install -y php5 php5-gd php5-mysql php5-curl php5-cli php5-cgi php5-dev

apt-get install -y php-pear
pecl install mongo
cd /etc/php5/apache2/conf.d/
ln -s /vagrant/etc/apache2/mongo.ini

# tools
apt-get install -y unzip

# genghis
cd /opt
wget https://github.com/bobthecow/genghis/archive/v2.3.10.zip
unzip v2.3.10.zip

# beanstalk console
cd /opt
git clone https://github.com/ptrofimov/beanstalk_console.git

cd /vagrant/tools
ln -sf /opt/beanstalk_console/public beanstalkd
ln -sf /opt/genghis-2.3.10 mongo

# redis
apt-get -y install tcl8.5
cd /opt
wget http://download.redis.io/releases/redis-2.8.5.tar.gz
tar xzf redis-2.8.5.tar.gz
cd redis-2.8.5
make
make install
cd utils/
# todo, make this next step non-interactive
./install_server.sh


# mod_h264
# cd /opt
# wget http://h264.code-shop.com/download/apache_mod_h264_streaming-2.2.7.tar.gz
# tar -zxvf apache_mod_h264_streaming-2.2.7.tar.gz
# cd /opt/mod_h264_streaming-2.2.7
# ./configure --with-apxs=`which apxs2`
# make
# make install

# vhost
cd /etc/apache2/sites-enabled/
ln -sf /vagrant/etc/apache2/VirtualHost.conf 000-default

# ports
cd /etc/apache2/
ln -sf /vagrant/etc/apache2/ports.conf

# apache modules
cd /etc/apache2/mods-enabled
ln -s ../mods-available/rewrite.load
ln -s ../mods-available/headers.load
ln -sf /vagrant/etc/apache2/status.conf
ln -sf /vagrant/etc/apache2/status.conf
ln -sf /vagrant/etc/apache2/h264-streaming.conf

# restart apache
service apache2 restart


# haproxy
apt-get install -y haproxy hatop
cd /etc/default/
ln -sf /vagrant/etc/default/haproxy
cd /etc/haproxy/
ln -sf /vagrant/etc/haproxy/haproxy.cfg
service haproxy start

# cube
cd /opt
git clone https://github.com/square/cube.git
cd cube
npm install
pm2 start bin/collector.js
pm2 start bin/evaluator.js

pm2 web

cd /vagrant
npm install
pm2 start processes.json
